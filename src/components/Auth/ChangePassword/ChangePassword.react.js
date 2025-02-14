import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import zxcvbn from 'zxcvbn';
import styled from 'styled-components';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import FormHelperText from '@material-ui/core/FormHelperText';
import _PasswordField from 'material-ui-password-field';
import Dialog from '@material-ui/core/Dialog';
import CircularProgress from '@material-ui/core/CircularProgress';
import CloseButton from '../../shared/CloseButton';
import Translate from '../../Translate/Translate.react';
import appActions from '../../../redux/actions/app';
import uiActions from '../../../redux/actions/ui';
import { DialogContainer } from '../../shared/Container';
import './ChangePassword.css';

const PasswordField = styled(_PasswordField)`
  height: 35px;
  border-radius: 4;
  border: 1px solid #ced4da;
  padding: 0px 12px;
  width: 17rem;
  @media (max-width: 520) {
    width: 14rem;
  }
`;

const styles = {
  labelStyle: {
    width: '30%',
    minWidth: '150px',
    float: 'left',
    marginTop: '12px',
  },
  submitBtnStyle: {
    float: 'left',
    width: '300px',
    margin: '0 auto',
    marginBottom: '50px',
  },
};

class ChangePassword extends Component {
  static propTypes = {
    history: PropTypes.object,
    settings: PropTypes.object,
    actions: PropTypes.object,
    email: PropTypes.string,
  };

  constructor(props) {
    super(props);

    this.state = {
      password: '',
      passwordErrorMessage: '',
      newPassword: '',
      newPasswordErrorMessage: '',
      newPasswordStrength: '',
      newPasswordScore: -1,
      confirmNewPassword: '',
      newPasswordConfirmErrorMessage: '',
      dialogMessage: '',
      success: false,
      loading: false,
    };
  }

  handleCloseResetPassword = () => {
    const { success } = this.state;
    if (success) {
      this.props.history.push('/logout');
    } else {
      this.setState({
        password: '',
        passwordErrorMessage: '',
        newPassword: '',
        newPasswordErrorMessage: '',
        newPasswordStrength: '',
        newPasswordScore: -1,
        confirmNewPassword: '',
        newPasswordConfirmErrorMessage: '',
        dialogMessage: '',
        success: false,
        loading: false,
      });
    }
  };

  // Handle changes to current, new and confirm new passwords
  handleTextFieldChange = event => {
    switch (event.target.name) {
      case 'password': {
        const password = event.target.value.trim();
        const passwordError = !(
          password &&
          password.length >= 6 &&
          password.length <= 64
        );
        this.setState({
          password,
          passwordErrorMessage: passwordError ? (
            <Translate text="Must be between 6 to 64 characters" />
          ) : (
            ''
          ),
        });
        break;
      }
      case 'newPassword': {
        const {
          confirmNewPassword,
          newPasswordConfirmErrorMessage,
        } = this.state;
        const newPassword = event.target.value.trim();
        const newPasswordError = !(
          newPassword &&
          newPassword.length >= 6 &&
          newPassword.length <= 64
        );
        const newPasswordScore = !newPasswordError
          ? zxcvbn(newPassword).score
          : -1;
        const newPasswordStrength = !newPasswordError
          ? [
              <Translate key={1} text="Too Insecure" />,
              <Translate key={2} text="Bad" />,
              <Translate key={3} text="Weak" />,
              <Translate key={4} text="Good" />,
              <Translate key={5} text="Strong" />,
            ][newPasswordScore]
          : '';

        const newPasswordConfirmError =
          (confirmNewPassword || newPasswordConfirmErrorMessage) &&
          !(confirmNewPassword === newPassword);

        this.setState({
          newPassword,
          newPasswordErrorMessage: newPasswordError ? (
            <Translate text="Must be between 6 to 64 characters" />
          ) : (
            ''
          ),
          newPasswordScore,
          newPasswordStrength,
          newPasswordConfirmErrorMessage: newPasswordConfirmError ? (
            <Translate text="Password does not match" />
          ) : (
            ''
          ),
        });
        break;
      }
      case 'confirmNewPassword': {
        const { newPassword } = this.state;
        const confirmNewPassword = event.target.value.trim();
        const newPasswordConfirmError = !(
          confirmNewPassword && confirmNewPassword === newPassword
        );
        this.setState({
          confirmNewPassword,
          newPasswordConfirmErrorMessage: newPasswordConfirmError ? (
            <Translate text="Password does not match" />
          ) : (
            ''
          ),
        });
        break;
      }
      default:
        break;
    }
  };

  changePassword = event => {
    event.preventDefault();
    const {
      password,
      newPassword,
      passwordErrorMessage,
      newPasswordErrorMessage,
      newPasswordConfirmErrorMessage,
    } = this.state;
    const { actions, email } = this.props;

    if (
      !(
        passwordErrorMessage ||
        newPasswordErrorMessage ||
        newPasswordConfirmErrorMessage
      )
    ) {
      this.setState({
        loading: true,
      });
      actions
        .getChangePassword({
          email,
          password: encodeURIComponent(password),
          newPassword: encodeURIComponent(newPassword),
        })
        .then(({ payload }) => {
          let dialogMessage;
          let success;
          if (payload.accepted) {
            dialogMessage = `${payload.message}\n Please login again.`;
            success = true;
          } else {
            dialogMessage = `${payload.message}\n Please Try Again.`;
            success = false;
          }
          this.setState({
            dialogMessage,
            success,
            loading: false,
          });
        })
        .catch(error => {
          this.setState({
            dialogMessage: 'Failed. Try Again',
            loading: false,
          });
        });
    }
  };

  render() {
    const {
      password,
      passwordErrorMessage,
      newPassword,
      newPasswordErrorMessage,
      confirmNewPassword,
      newPasswordConfirmErrorMessage,
      newPasswordScore,
      newPasswordStrength,
      dialogMessage,
      loading,
    } = this.state;

    const { settings, actions } = this.props;

    const isValid =
      !passwordErrorMessage &&
      !newPasswordErrorMessage &&
      !newPasswordConfirmErrorMessage &&
      password &&
      newPassword &&
      confirmNewPassword;

    const themeForegroundColor =
      (settings && settings.theme) === 'dark' ? '#fff' : '#272727';

    const PasswordClass = [`is-strength-${newPasswordScore}`];

    const { labelStyle, submitBtnStyle } = styles;

    return (
      <div className="changePasswordForm">
        <div style={{ ...labelStyle, color: themeForegroundColor }}>
          Current Password
        </div>
        <div>
          <FormControl error={passwordErrorMessage !== ''}>
            <PasswordField
              name="password"
              value={password}
              onChange={this.handleTextFieldChange}
            />
            <FormHelperText error={passwordErrorMessage !== ''}>
              {passwordErrorMessage}
            </FormHelperText>
          </FormControl>
        </div>
        <div style={{ ...labelStyle, color: themeForegroundColor }}>
          New Password
        </div>
        <div className={PasswordClass.join(' ')}>
          <FormControl error={newPasswordErrorMessage !== ''}>
            <PasswordField
              name="newPassword"
              placeholder="Must be between 6-64 characters"
              value={newPassword}
              onChange={this.handleTextFieldChange}
            />
            <FormHelperText error={newPasswordErrorMessage !== ''}>
              {newPasswordErrorMessage}
            </FormHelperText>
          </FormControl>
          <div className="ReactPasswordStrength-strength-bar" />
          <div>{newPasswordStrength}</div>
        </div>
        <div style={{ ...labelStyle, color: themeForegroundColor }}>
          Verify Password
        </div>
        <div>
          <FormControl error={newPasswordConfirmErrorMessage !== ''}>
            <PasswordField
              name="confirmNewPassword"
              placeholder="Must match the new password"
              value={confirmNewPassword}
              onChange={this.handleTextFieldChange}
            />
            <FormHelperText error={newPasswordConfirmErrorMessage !== ''}>
              {newPasswordConfirmErrorMessage}
            </FormHelperText>
          </FormControl>
        </div>
        <div style={submitBtnStyle}>
          <div className="forgot">
            <a
              onClick={() => actions.openModal({ modalType: 'forgotPassword' })}
            >
              Forgot your password?
            </a>
          </div>
          <div>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={!isValid || loading}
              onClick={this.changePassword}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                <Translate text="Save Changes" />
              )}
            </Button>
          </div>
        </div>
        <Dialog
          open={dialogMessage}
          onClose={this.handleCloseResetPassword}
          maxWidth={'xs'}
          fullWidth={true}
        >
          <DialogContainer>
            <Translate text={dialogMessage} />
            <CloseButton onClick={this.handleCloseResetPassword} />
          </DialogContainer>
        </Dialog>
      </div>
    );
  }
}

function mapStateToProps(store) {
  const { email } = store.app;
  return {
    email,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ ...appActions, ...uiActions }, dispatch),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(ChangePassword);
